// 应用状态
const appState = {
    currentProject: null,
    projects: [],
    isConnecting: false,
    selectedNode: null,
    archiveCategories: ['已完成', '暂停', '取消'], // 默认归档分类
    tempConnection: null,
    mousePos: { x: 0, y: 0 },
    draggedNode: null,
    canvasOffset: { x: 0, y: 0 },
    canvasScale: 1.0
};

// DOM元素引用
const elements = {};

// 初始化DOM元素引用
function initializeElements() {
    elements.newProjectBtn = document.getElementById('newProjectBtn');
    elements.recentProjects = document.getElementById('recentProjects');
    elements.currentProjectName = document.getElementById('currentProjectName');
    elements.saveBtn = document.getElementById('saveBtn');
    elements.canvas = document.getElementById('canvas');
    elements.nodesLayer = document.getElementById('nodesLayer');
    elements.connectionsLayer = document.getElementById('connectionsLayer');
    
    // 项目列表
    elements.projectList = document.getElementById('recentProjects');
    
    // 归档相关元素
    elements.archiveProjects = document.getElementById('archiveProjects');
    elements.manageArchiveCategoriesBtn = document.getElementById('manageArchiveCategoriesBtn');
    elements.archiveCategoryModal = document.getElementById('archiveCategoryModal');
    elements.archiveCategoryModalClose = document.getElementById('archiveCategoryModalClose');
    elements.archiveCategoryModalClose2 = document.getElementById('archiveCategoryModalClose2');
    elements.newArchiveCategoryName = document.getElementById('newArchiveCategoryName');
    elements.addArchiveCategoryBtn = document.getElementById('addArchiveCategoryBtn');
    elements.archiveCategoryList = document.getElementById('archiveCategoryList');
    
    // 模态框元素
    elements.projectModal = document.getElementById('projectModal');
    elements.modalClose = document.getElementById('modalClose');
    elements.modalCancel = document.getElementById('modalCancel');
    elements.modalConfirm = document.getElementById('modalConfirm');
    elements.projectNameInput = document.getElementById('projectNameInput');
    
    // 右键菜单元素
    elements.contextMenu = document.getElementById('contextMenu');
    elements.createNodeItem = document.getElementById('createNode');
    elements.editNodeItem = document.getElementById('editNode');
    elements.toggleImportanceItem = document.getElementById('toggleImportance');
    elements.deleteNodeItem = document.getElementById('deleteNode');
    elements.menuSeparator = document.getElementById('menuSeparator');
    
    // 编辑节点模态框元素
    elements.editNodeModal = document.getElementById('editNodeModal');
    elements.editModalClose = document.getElementById('editModalClose');
    elements.editModalCancel = document.getElementById('editModalCancel');
    elements.editModalConfirm = document.getElementById('editModalConfirm');
    elements.editNodeInput = document.getElementById('editNodeInput');
    
    // 资源管理元素
    elements.resourceSidebar = document.getElementById('resourceSidebar');
    elements.selectedNodeInfo = document.getElementById('selectedNodeInfo');
    elements.resourceContent = document.getElementById('resourceContent');
    elements.addResourceBtn = document.getElementById('addResourceBtn');
    elements.addResourceBtnBottom = document.getElementById('addResourceBtnBottom');
    elements.resourceList = document.getElementById('resourceList');
    elements.closeSidebar = document.getElementById('closeSidebar');
    elements.resizeHandle = document.querySelector('.sidebar-resize-handle');
    elements.resourceSearch = document.getElementById('resourceSearch');
    elements.resourceCategories = document.getElementById('resourceCategories');
    
    // 资源模态框元素
    elements.resourceModal = document.getElementById('resourceModal');
    elements.resourceModalClose = document.getElementById('resourceModalClose');
    elements.resourceModalCancel = document.getElementById('resourceModalCancel');
    elements.resourceModalConfirm = document.getElementById('resourceModalConfirm');
    elements.resourceType = document.getElementById('resourceType');
    elements.resourceTitle = document.getElementById('resourceTitle');
    elements.resourceUrl = document.getElementById('resourceUrl');
    elements.resourceContent = document.getElementById('resourceContent');
    elements.resourceUrlGroup = document.getElementById('resourceUrlGroup');
    elements.resourceContentGroup = document.getElementById('resourceContentGroup');
}

// 资源类
class Resource {
    constructor(type, title, url = '', content = '') {
        this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.type = type; // 'link', 'note', 'image', 'document', 'code'
        this.title = title;
        this.url = url;
        this.content = content;
        this.filePath = '';
        this.category = '';
        this.createdAt = new Date();
    }
}

// 节点类
class Node {
    constructor(title, x, y) {
        this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.title = title;
        this.x = x;
        this.y = y;
        this.isImportant = false;
        this.resources = [];
        this.createdAt = new Date();
    }

    addResource(resource) {
        this.resources.push(resource);
    }

    removeResource(resourceId) {
        this.resources = this.resources.filter(r => r.id !== resourceId);
    }

    findResource(resourceId) {
        return this.resources.find(r => r.id === resourceId);
    }
}

// 连接类
class Connection {
    constructor(fromNodeId, toNodeId) {
        this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.fromId = fromNodeId;
        this.toId = toNodeId;
        this.createdAt = new Date();
    }
}

// 项目类
class Project {
    constructor(name) {
        this.id = Date.now().toString();
        this.name = name;
        this.nodes = [];
        this.connections = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.isArchived = false;
        this.archiveCategory = '';
        this.archivedAt = null;
    }

    // 添加节点
    addNode(node) {
        this.nodes.push(node);
        this.updatedAt = new Date();
    }

    // 删除节点
    removeNode(nodeId) {
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        this.updatedAt = new Date();
    }

    // 根据ID查找节点
    findNode(nodeId) {
        return this.nodes.find(n => n.id === nodeId);
    }

    // 添加连接
    addConnection(connection) {
        this.connections.push(connection);
        this.updatedAt = new Date();
    }

    // 删除连接
    removeConnection(connectionId) {
        this.connections = this.connections.filter(c => c.id !== connectionId);
        this.updatedAt = new Date();
    }
}

// 项目管理器
const projectManager = {
    // 创建新项目
    createProject(name) {
        const project = new Project(name);
        appState.projects.unshift(project);
        this.setCurrentProject(project);
        this.updateProjectList();
        this.saveToStorage();
        return project;
    },

    // 设置当前项目
    setCurrentProject(project) {
        appState.currentProject = project;
        elements.currentProjectName.textContent = project ? project.name : '请选择或创建项目';
        this.updateProjectList();
    },

    // 更新项目列表显示
    updateProjectList() {
        if (!elements.projectList) return;
        
        elements.projectList.innerHTML = '';
        
        // 过滤出未归档的项目
        const activeProjects = appState.projects.filter(p => !p.isArchived);
        const maxVisible = 3; // 最多显示3个项目
        
        // 显示前3个项目
        const visibleProjects = activeProjects.slice(0, maxVisible);
        const hiddenProjects = activeProjects.slice(maxVisible);
        
        visibleProjects.forEach(project => {
            const item = this.createProjectItem(project);
            elements.projectList.appendChild(item);
        });
        
        // 如果有超过3个项目，添加折叠区域
        if (hiddenProjects.length > 0) {
            const collapseContainer = document.createElement('div');
            collapseContainer.className = 'project-collapse-container';
            
            // 展开/收起按钮
            const toggleBtn = document.createElement('div');
            toggleBtn.className = 'project-toggle-btn';
            toggleBtn.innerHTML = `
                <i class="fas fa-chevron-down"></i>
                <span>显示更多项目 (${hiddenProjects.length})</span>
            `;
            
            // 隐藏的项目容器
            const hiddenContainer = document.createElement('div');
            hiddenContainer.className = 'project-hidden-container';
            hiddenContainer.style.display = 'none';
            
            hiddenProjects.forEach(project => {
                const item = this.createProjectItem(project);
                hiddenContainer.appendChild(item);
            });
            
            // 点击切换显示/隐藏
            toggleBtn.addEventListener('click', () => {
                const isHidden = hiddenContainer.style.display === 'none';
                hiddenContainer.style.display = isHidden ? 'block' : 'none';
                const icon = toggleBtn.querySelector('i');
                const text = toggleBtn.querySelector('span');
                
                if (isHidden) {
                    icon.className = 'fas fa-chevron-up';
                    text.textContent = '收起项目';
                } else {
                    icon.className = 'fas fa-chevron-down';
                    text.textContent = `显示更多项目 (${hiddenProjects.length})`;
                }
            });
            
            collapseContainer.appendChild(toggleBtn);
            collapseContainer.appendChild(hiddenContainer);
            elements.projectList.appendChild(collapseContainer);
        }
    },

    // 创建项目列表项
    createProjectItem(project) {
        const item = document.createElement('div');
        item.className = 'project-item';
        if (appState.currentProject && project.id === appState.currentProject.id) {
            item.classList.add('active');
        }
        
        item.innerHTML = `
            <div class="project-content">
                <div class="project-name">${project.name}</div>
                <div class="project-info">${project.nodes.length} 个节点 • ${this.formatDate(project.updatedAt)}</div>
            </div>
            <div class="project-actions">
                <button class="project-action-btn edit-btn" onclick="projectManager.editProject('${project.id}')" title="编辑项目">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="project-action-btn archive-btn" onclick="archiveManager.showArchiveModal('${project.id}')" title="归档项目">
                    <i class="fas fa-archive"></i>
                </button>
                <button class="project-action-btn delete-btn" onclick="projectManager.deleteProject('${project.id}')" title="删除项目">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // 点击项目内容区域切换项目
        const projectContent = item.querySelector('.project-content');
        projectContent.addEventListener('click', () => {
            this.setCurrentProject(project);
            canvasRenderer.render(); // 切换项目时重新渲染画布
        });
        
        return item;
    },

    // 格式化日期
    formatDate(date) {
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    // 保存到本地存储
    saveToStorage() {
        localStorage.setItem('learningPathwayProjects', JSON.stringify(appState.projects));
        localStorage.setItem('learningPathwayArchiveCategories', JSON.stringify(appState.archiveCategories));
        if (appState.currentProject) {
            localStorage.setItem('learningPathwayCurrentProject', appState.currentProject.id);
        }
    },

    // 从本地存储加载
    loadFromStorage() {
        const savedProjects = localStorage.getItem('learningPathwayProjects');
        if (savedProjects) {
            appState.projects = JSON.parse(savedProjects).map(data => {
                const project = new Project(data.name);
                Object.assign(project, data);
                project.createdAt = new Date(data.createdAt);
                project.updatedAt = new Date(data.updatedAt);
                if (data.archivedAt) {
                    project.archivedAt = new Date(data.archivedAt);
                }
                // 恢复节点数据
                if (data.nodes) {
                    project.nodes = data.nodes.map(nodeData => {
                        const node = new Node(nodeData.title, nodeData.x, nodeData.y);
                        Object.assign(node, nodeData);
                        node.createdAt = new Date(nodeData.createdAt);
                        return node;
                    });
                }
                // 恢复连接数据
                if (data.connections) {
                    project.connections = data.connections.map(connData => {
                        const connection = new Connection(connData.fromId, connData.toId);
                        Object.assign(connection, connData);
                        connection.createdAt = new Date(connData.createdAt);
                        return connection;
                    });
                }
                return project;
            });
        }

        const currentProjectId = localStorage.getItem('learningPathwayCurrentProject');
        if (currentProjectId) {
            const currentProject = appState.projects.find(p => p.id === currentProjectId);
            if (currentProject) {
                this.setCurrentProject(currentProject);
            }
        }

        // 加载归档分类
        const savedCategories = localStorage.getItem('learningPathwayArchiveCategories');
        if (savedCategories) {
            appState.archiveCategories = JSON.parse(savedCategories);
        }

        this.updateProjectList();
        archiveManager.updateArchiveDisplay();
    },

    // 编辑项目
    editProject(projectId) {
        const project = appState.projects.find(p => p.id === projectId);
        if (!project) return;

        const newName = prompt('请输入新的项目名称:', project.name);
        if (newName && newName.trim() && newName.trim() !== project.name) {
            project.name = newName.trim();
            project.updatedAt = new Date();
            this.updateProjectList();
            this.saveToStorage();
            
            // 如果是当前项目，更新显示
            if (appState.currentProject && appState.currentProject.id === projectId) {
                elements.currentProjectName.textContent = project.name;
            }
        }
    },

    // 删除项目
    deleteProject(projectId) {
        const project = appState.projects.find(p => p.id === projectId);
        if (!project) return;

        if (confirm(`确定要删除项目"${project.name}"吗？此操作不可撤销。`)) {
            // 如果删除的是当前项目，清空当前项目
            if (appState.currentProject && appState.currentProject.id === projectId) {
                appState.currentProject = null;
                elements.currentProjectName.textContent = '请选择或创建项目';
                canvasRenderer.render(); // 清空画布
            }

            // 从项目列表中移除
            appState.projects = appState.projects.filter(p => p.id !== projectId);
            this.updateProjectList();
            this.saveToStorage();
        }
    }
};

// 模态框管理器
const modalManager = {
    // 显示新建项目模态框
    showNewProjectModal() {
        elements.projectNameInput.value = '';
        elements.projectModal.style.display = 'flex';
        elements.projectNameInput.focus();
    },

    // 隐藏项目模态框
    hideProjectModal() {
        elements.projectModal.style.display = 'none';
    },

    // 确认创建项目
    confirmCreateProject() {
        const name = elements.projectNameInput.value.trim();
        if (!name) {
            alert('请输入项目名称');
            return;
        }

        projectManager.createProject(name);
        this.hideProjectModal();
    }
};

// 事件监听器设置
function setupEventListeners() {
    // 新建项目按钮
    if (elements.newProjectBtn) {
        elements.newProjectBtn.addEventListener('click', () => {
            modalManager.showNewProjectModal();
        });
    }

    // 模态框关闭事件
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', () => {
            elements.projectModal.style.display = 'none';
        });
    }

    if (elements.modalCancel) {
        elements.modalCancel.addEventListener('click', () => {
            elements.projectModal.style.display = 'none';
        });
    }

    if (elements.modalConfirm) {
        elements.modalConfirm.addEventListener('click', () => {
            modalManager.confirmCreateProject();
        });
    }

    if (elements.projectNameInput) {
        elements.projectNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                elements.modalConfirm.click();
            }
        });
    }

    // 保存按钮事件
    if (elements.saveBtn) {
        elements.saveBtn.addEventListener('click', () => {
            if (!appState.currentProject) {
                alert('请先选择一个项目');
                return;
            }
            projectManager.saveToStorage();
            alert('项目已保存');
        });
    }

    // 归档分类管理事件
    if (elements.manageArchiveCategoriesBtn) {
        elements.manageArchiveCategoriesBtn.addEventListener('click', () => {
            archiveManager.showCategoryManagement();
        });
    }

    if (elements.archiveCategoryModalClose) {
        elements.archiveCategoryModalClose.addEventListener('click', () => {
            elements.archiveCategoryModal.style.display = 'none';
        });
    }

    if (elements.archiveCategoryModalClose2) {
        elements.archiveCategoryModalClose2.addEventListener('click', () => {
            elements.archiveCategoryModal.style.display = 'none';
        });
    }

    if (elements.addArchiveCategoryBtn) {
        elements.addArchiveCategoryBtn.addEventListener('click', () => {
            archiveManager.addCategory();
        });
    }

    if (elements.newArchiveCategoryName) {
        elements.newArchiveCategoryName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                archiveManager.addCategory();
            }
        });
    }

    // 画布事件
    if (elements.canvas) {
        elements.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            contextMenuManager.showMenu(e);
        });

        // 画布滚轮事件 - 支持上下滑动和Ctrl+滚轮缩放
        elements.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (e.ctrlKey) {
                // Ctrl + 滚轮缩放
                const zoomSpeed = 0.1;
                const zoomDelta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
                
                // 限制缩放范围
                const newScale = Math.max(0.3, Math.min(3.0, appState.canvasScale + zoomDelta));
                
                if (newScale !== appState.canvasScale) {
                    // 获取鼠标在画布上的位置
                    const rect = elements.canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    // 计算缩放前鼠标在画布坐标系中的位置
                    const worldX = (mouseX - appState.canvasOffset.x) / appState.canvasScale;
                    const worldY = (mouseY - appState.canvasOffset.y) / appState.canvasScale;
                    
                    // 更新缩放比例
                    appState.canvasScale = newScale;
                    
                    // 调整偏移量，使鼠标位置保持不变
                    appState.canvasOffset.x = mouseX - worldX * appState.canvasScale;
                    appState.canvasOffset.y = mouseY - worldY * appState.canvasScale;
                    
                    canvasRenderer.render();
                }
            } else {
                // 普通滚轮上下滑动
                const scrollSpeed = 30;
                const deltaY = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
                
                // 更新画布偏移
                appState.canvasOffset.y += deltaY;
                canvasRenderer.render();
            }
        });

        // 点击画布退出连接模式和隐藏右键菜单
        elements.canvas.addEventListener('click', (e) => {
            if (appState.isConnecting) {
                connectionManager.exitConnectionMode();
            }
            contextMenuManager.hideMenu();
        });
    }

    // 右键菜单事件
    if (elements.createNodeItem) {
        elements.createNodeItem.addEventListener('click', () => {
            contextMenuManager.createNode();
        });
    }

    if (elements.editNodeItem) {
        elements.editNodeItem.addEventListener('click', () => {
            contextMenuManager.editNode();
        });
    }

    if (elements.toggleImportanceItem) {
        elements.toggleImportanceItem.addEventListener('click', () => {
            contextMenuManager.toggleImportance();
        });
    }

    if (elements.deleteNodeItem) {
        elements.deleteNodeItem.addEventListener('click', () => {
            contextMenuManager.deleteNode();
        });
    }

    // 编辑节点模态框事件
    if (elements.editModalClose) {
        elements.editModalClose.addEventListener('click', () => {
            elements.editNodeModal.style.display = 'none';
        });
    }

    if (elements.editModalCancel) {
        elements.editModalCancel.addEventListener('click', () => {
            elements.editNodeModal.style.display = 'none';
        });
    }

    if (elements.editModalConfirm) {
        elements.editModalConfirm.addEventListener('click', () => {
            const newTitle = elements.editNodeInput.value.trim();
            if (newTitle && contextMenuManager.currentNode) {
                contextMenuManager.currentNode.title = newTitle;
                canvasRenderer.render();
                projectManager.saveToStorage();
                elements.editNodeModal.style.display = 'none';
            }
        });
    }

    if (elements.editNodeInput) {
        elements.editNodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                elements.editModalConfirm.click();
            }
        });
    }

    // 资源管理事件
    if (elements.addResourceBtn) {
        elements.addResourceBtn.addEventListener('click', () => {
            resourceManager.showAddResourceModal();
        });
    }
    
    if (elements.addResourceBtnBottom) {
        elements.addResourceBtnBottom.addEventListener('click', () => {
            resourceManager.showAddResourceModal();
        });
    }

    if (elements.resourceType) {
        elements.resourceType.addEventListener('change', () => {
            resourceManager.updateResourceForm();
        });

        // 绑定复制按钮事件
        if (document.getElementById('copyUrlBtn')) {
            document.getElementById('copyUrlBtn').addEventListener('click', () => {
                const url = document.getElementById('resourceUrl').value;
                if (url) {
                    navigator.clipboard.writeText(url).then(() => {
                        alert('链接地址已复制');
                    }).catch(() => {
                        alert('复制失败');
                    });
                }
            });
        }

        if (document.getElementById('copyFileBtn')) {
            document.getElementById('copyFileBtn').addEventListener('click', () => {
                const file = document.getElementById('resourceFile').value;
                if (file) {
                    navigator.clipboard.writeText(file).then(() => {
                        alert('文件地址已复制');
                    }).catch(() => {
                        alert('复制失败');
                    });
                }
            });
        }

        // 绑定分类管理按钮事件
        if (document.getElementById('manageCategoriesBtn')) {
            document.getElementById('manageCategoriesBtn').addEventListener('click', () => {
                resourceManager.showCategoryManagement();
            });
        }

        // 绑定侧边栏关闭按钮事件
        if (document.getElementById('closeSidebar')) {
            document.getElementById('closeSidebar').addEventListener('click', () => {
                sidebarManager.closeSidebar();
            });
        }

        // 绑定文件上传事件
        if (document.getElementById('resourceFileInput')) {
            document.getElementById('resourceFileInput').addEventListener('change', (e) => {
                resourceManager.handleFileUpload(e);
            });
        }

        if (document.getElementById('removeFileBtn')) {
            document.getElementById('removeFileBtn').addEventListener('click', () => {
                resourceManager.removeFile();
            });
        }

        // 绑定分类管理模态框事件
        if (document.getElementById('categoryModalClose')) {
            document.getElementById('categoryModalClose').addEventListener('click', () => {
                document.getElementById('categoryModal').style.display = 'none';
            });
        }

        if (document.getElementById('categoryModalClose2')) {
            document.getElementById('categoryModalClose2').addEventListener('click', () => {
                document.getElementById('categoryModal').style.display = 'none';
            });
        }

        if (document.getElementById('addCategoryBtn')) {
            document.getElementById('addCategoryBtn').addEventListener('click', () => {
                resourceManager.addCategory();
            });
        }
    }

    if (elements.resourceModalClose) {
        elements.resourceModalClose.addEventListener('click', () => {
            elements.resourceModal.style.display = 'none';
        });
    }

    if (elements.resourceModalCancel) {
        elements.resourceModalCancel.addEventListener('click', () => {
            elements.resourceModal.style.display = 'none';
        });
    }

    elements.resourceModalConfirm.addEventListener('click', () => {
        resourceManager.addResource();
    });

}

// 画布渲染系统
const canvasRenderer = {
    // 渲染整个画布
    render() {
        if (!appState.currentProject) {
            this.clear();
            return;
        }
        this.renderNodes();
        this.renderConnections();
    },

    // 清空画布
    clear() {
        if (elements.nodesLayer) {
            elements.nodesLayer.innerHTML = '';
        }
        if (elements.connectionsLayer) {
            elements.connectionsLayer.innerHTML = '';
        }
    },

    // 渲染节点
    renderNodes() {
        if (!elements.nodesLayer || !appState.currentProject) return;
        
        elements.nodesLayer.innerHTML = '';
        
        // 应用缩放和偏移变换
        elements.nodesLayer.style.transform = `translate(${appState.canvasOffset.x}px, ${appState.canvasOffset.y}px) scale(${appState.canvasScale})`;
        
        appState.currentProject.nodes.forEach(node => {
            const nodeElement = this.createNodeElement(node);
            if (nodeElement) {
                elements.nodesLayer.appendChild(nodeElement);
            }
        });
    },

    // 渲染连接线
    renderConnections() {
        if (!elements.connectionsLayer || !appState.currentProject) return;
        
        elements.connectionsLayer.innerHTML = '';
        
        // 应用缩放和偏移变换
        elements.connectionsLayer.style.transform = `translate(${appState.canvasOffset.x}px, ${appState.canvasOffset.y}px) scale(${appState.canvasScale})`;
        
        appState.currentProject.connections.forEach(connection => {
            const connectionElement = this.createConnectionElement(connection);
            if (connectionElement) {
                elements.connectionsLayer.appendChild(connectionElement);
            }
        });
    },

    // 创建连接线SVG元素
    createConnectionElement(connection) {
        const fromNode = appState.currentProject.findNode(connection.fromId);
        const toNode = appState.currentProject.findNode(connection.toId);
        
        if (!fromNode || !toNode) return null;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('stroke', '#a98ad9');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        line.classList.add('connection-line');

        return line;
    },

    // 创建节点SVG元素
    createNodeElement(node) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('node');
        g.setAttribute('data-node-id', node.id);
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        // 计算文本尺寸
        const textMetrics = this.measureText(node.title, 12);
        const padding = 16;
        const rectWidth = Math.max(textMetrics.width + padding, 80);
        const rectHeight = 40;

        // 节点矩形
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', -rectWidth/2);
        rect.setAttribute('y', -rectHeight/2);
        rect.setAttribute('width', rectWidth);
        rect.setAttribute('height', rectHeight);
        rect.setAttribute('fill', node.isImportant ? '#e74c3c' : '#c3809f');
        rect.setAttribute('stroke', '#fff');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '8');
        rect.setAttribute('ry', '8');
        rect.classList.add('node-rect');

        // 节点标题
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '5');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', '600');
        text.textContent = node.title;
        text.classList.add('node-text');

        // 创建时间
        const timeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        timeText.setAttribute('text-anchor', 'middle');
        timeText.setAttribute('dy', '45');
        timeText.setAttribute('fill', '#666');
        timeText.setAttribute('font-size', '10');
        timeText.textContent = this.formatDate(node.createdAt);
        timeText.classList.add('node-time');

        g.appendChild(rect);
        g.appendChild(text);
        g.appendChild(timeText);

        // 添加事件监听
        this.setupNodeEvents(g, node);

        return g;
    },

    // 设置节点事件
    setupNodeEvents(nodeElement, node) {
        let startX, startY, initialX, initialY;

        let dragTimeout;
        let isDragStarted = false;

        // 鼠标按下处理
        nodeElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 左键
                e.stopPropagation();
                
                // Ctrl+拖拽创建连接
                if (e.ctrlKey) {
                    e.preventDefault();
                    
                    // 开始连接模式
                    appState.isConnecting = true;
                    appState.connectionStart = node;
                    
                    // 创建临时连接线
                    connectionManager.startTempConnection(node, e);
                    
                    // 添加全局鼠标事件
                    document.addEventListener('mousemove', connectionManager.updateTempConnection);
                    document.addEventListener('mouseup', connectionManager.endTempConnection);
                    
                    console.log('开始拖拽连接:', node.title);
                    return;
                }
                
                // 普通拖拽
                startX = e.clientX;
                startY = e.clientY;
                initialX = node.x;
                initialY = node.y;
                isDragStarted = false;
                
                // 延迟启动拖拽，避免与双击冲突
                dragTimeout = setTimeout(() => {
                    if (!isDragStarted) {
                        appState.isDragging = true;
                        appState.draggedNode = node;
                        isDragStarted = true;
                        nodeElement.style.cursor = 'grabbing';
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }
                }, 150);
            }
        });

        // 鼠标移动处理
        function handleMouseMove(e) {
            if (appState.isDragging && appState.draggedNode === node) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                node.x = initialX + deltaX;
                node.y = initialY + deltaY;
                
                nodeElement.setAttribute('transform', `translate(${node.x}, ${node.y})`);
                
                // 更新连接线
                canvasRenderer.renderConnections();
            }
        }

        // 鼠标释放处理
        function handleMouseUp(e) {
            // 清除拖拽延迟
            if (dragTimeout) {
                clearTimeout(dragTimeout);
                dragTimeout = null;
            }
            
            if (appState.isDragging && appState.draggedNode === node) {
                appState.isDragging = false;
                appState.draggedNode = null;
                nodeElement.style.cursor = 'grab';
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                
                // 保存更改
                projectManager.saveToStorage();
            }
            isDragStarted = false;
        }

        // 双击打开侧边栏
        nodeElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            resourceManager.selectNode(node);
            console.log('节点被双击，打开侧边栏:', node.title);
        });

        // 右键菜单
        nodeElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡到画布
            contextMenuManager.showMenu(e, node);
        });

        // 设置初始样式
        nodeElement.style.cursor = 'grab';
    },

    // 测量文本尺寸
    measureText(text, fontSize) {
        // 创建临时canvas来测量文本宽度
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `600 ${fontSize}px Arial`;
        const metrics = context.measureText(text);
        return {
            width: metrics.width,
            height: fontSize
        };
    },

    // 格式化日期
    formatDate(date) {
        return new Intl.DateTimeFormat('zh-CN', {
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    }
};

// 节点管理器
const nodeManager = {
    // 创建新节点
    createNode(title, x, y) {
        if (!appState.currentProject) {
            alert('请先选择一个项目');
            return null;
        }

        const node = new Node(title, x, y);
        appState.currentProject.addNode(node);
        canvasRenderer.render();
        projectManager.saveToStorage();
        return node;
    }
};

// 右键菜单管理器
const contextMenuManager = {
    currentNode: null,
    clickPosition: { x: 0, y: 0 },

    // 显示统一右键菜单
    showMenu(event, node = null) {
        this.currentNode = node;
        
        // 记录点击位置（用于新建节点）
        const canvasRect = elements.canvas.getBoundingClientRect();
        this.clickPosition.x = event.clientX - canvasRect.left;
        this.clickPosition.y = event.clientY - canvasRect.top;
        
        if (node) {
            // 节点右键菜单：隐藏新建节点，显示其他选项
            elements.createNodeItem.style.display = 'none';
            elements.menuSeparator.style.display = 'none';
            elements.editNodeItem.style.display = 'block';
            elements.toggleImportanceItem.style.display = 'block';
            elements.deleteNodeItem.style.display = 'block';
            
            // 更新菜单项文本
            const importanceText = node.isImportant ? '取消重要' : '标记重要';
            elements.toggleImportanceItem.querySelector('span:last-child').textContent = importanceText;
        } else {
            // 画布右键菜单：只显示新建节点
            elements.createNodeItem.style.display = 'block';
            elements.menuSeparator.style.display = 'none';
            elements.editNodeItem.style.display = 'none';
            elements.toggleImportanceItem.style.display = 'none';
            elements.deleteNodeItem.style.display = 'none';
        }
        
        // 显示菜单
        elements.contextMenu.style.display = 'block';
        elements.contextMenu.style.left = event.clientX + 'px';
        elements.contextMenu.style.top = event.clientY + 'px';
        
        // 防止菜单超出屏幕
        const menuRect = elements.contextMenu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            elements.contextMenu.style.left = (event.clientX - menuRect.width) + 'px';
        }
        if (menuRect.bottom > window.innerHeight) {
            elements.contextMenu.style.top = (event.clientY - menuRect.height) + 'px';
        }
    },

    // 新建节点
    createNode() {
        const title = prompt('请输入节点名称：', '新节点');
        if (title && title.trim()) {
            nodeManager.createNode(title.trim(), this.clickPosition.x, this.clickPosition.y);
        }
        this.hideMenu();
    },

    // 隐藏右键菜单
    hideMenu() {
        elements.contextMenu.style.display = 'none';
        this.currentNode = null;
    },

    // 编辑节点
    editNode() {
        if (!this.currentNode) return;
        
        elements.editNodeInput.value = this.currentNode.title;
        elements.editNodeModal.style.display = 'flex';
        elements.editNodeInput.focus();
        this.hideMenu();
    },

    // 切换节点重要性
    toggleImportance() {
        if (!this.currentNode) return;
        
        this.currentNode.isImportant = !this.currentNode.isImportant;
        canvasRenderer.render();
        projectManager.saveToStorage();
        this.hideMenu();
    },

    // 删除节点
    deleteNode() {
        if (!this.currentNode) return;
        
        if (confirm(`确定要删除节点"${this.currentNode.title}"吗？`)) {
            // 删除相关连接
            appState.currentProject.connections = appState.currentProject.connections.filter(
                conn => conn.fromId !== this.currentNode.id && conn.toId !== this.currentNode.id
            );
            
            // 删除节点
            appState.currentProject.removeNode(this.currentNode.id);
            canvasRenderer.render();
            projectManager.saveToStorage();
        }
        this.hideMenu();
    },

};

// 归档管理器
const archiveManager = {
    // 显示归档模态框
    showArchiveModal(projectId) {
        const project = appState.projects.find(p => p.id === projectId);
        if (!project) return;

        const categoryOptions = appState.archiveCategories.map(cat => 
            `<option value="${cat}">${cat}</option>`
        ).join('');

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>归档项目</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <p>确定要归档项目 "<strong>${project.name}</strong>" 吗？</p>
                    <div class="form-group">
                        <label>选择归档分类：</label>
                        <select id="archiveCategorySelect" class="form-control">
                            ${categoryOptions}
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    <button class="btn btn-primary" onclick="archiveManager.archiveProject('${projectId}', document.getElementById('archiveCategorySelect').value); this.closest('.modal').remove();">确认归档</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 归档项目
    archiveProject(projectId, category) {
        const project = appState.projects.find(p => p.id === projectId);
        project.isArchived = true;
        project.archiveCategory = category;
        project.archivedAt = new Date();

        // 如果归档的是当前项目，清除当前项目
        if (appState.currentProject && appState.currentProject.id === projectId) {
            projectManager.setCurrentProject(null);
            canvasRenderer.clear();
        }

        projectManager.updateProjectList();
        this.updateArchiveDisplay();
        projectManager.saveToStorage();
        alert(`项目已归档到"${category}"分类`);
    },


    // 更新归档显示
    updateArchiveDisplay() {
        if (!elements.archiveProjects) return;

        const archivedProjects = appState.projects.filter(p => p.isArchived);
        elements.archiveProjects.innerHTML = '';

        if (archivedProjects.length === 0) {
            elements.archiveProjects.innerHTML = '<div class="empty-archive">暂无归档项目</div>';
            return;
        }

        // 按分类组织项目
        const projectsByCategory = {};
        archivedProjects.forEach(project => {
            const category = project.archiveCategory || '未分类';
            if (!projectsByCategory[category]) {
                projectsByCategory[category] = [];
            }
            projectsByCategory[category].push(project);
        });

        // 渲染每个分类
        Object.keys(projectsByCategory).forEach(category => {
            const categoryProjects = projectsByCategory[category];
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'archive-category';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'archive-category-header';
            headerDiv.innerHTML = `
                <div>
                    <i class="fas fa-chevron-down"></i>
                    <span>${category} (${categoryProjects.length})</span>
                </div>
                <button class="btn-icon" onclick="archiveManager.deleteCategoryProjects('${category}')" title="删除分类">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            const projectsDiv = document.createElement('div');
            projectsDiv.className = 'archive-category-projects';
            projectsDiv.style.display = 'none';

            categoryProjects.forEach(project => {
                const projectItem = document.createElement('div');
                projectItem.className = 'archive-project-item';
                projectItem.innerHTML = `
                    <div class="archive-project-content" onclick="projectManager.setCurrentProject(appState.projects.find(p => p.id === '${project.id}'))">
                        <div class="archive-project-name">${project.name}</div>
                        <div class="archive-project-info">${project.nodes.length} 个节点 • ${projectManager.formatDate(project.archivedAt)}</div>
                    </div>
                    <div class="archive-project-actions">
                        <button class="btn-icon" onclick="archiveManager.unarchiveProject('${project.id}')" title="取消归档">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn-icon" onclick="archiveManager.deleteArchivedProject('${project.id}')" title="删除项目">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                projectsDiv.appendChild(projectItem);
            });

            // 点击标题切换折叠
            headerDiv.addEventListener('click', (e) => {
                if (e.target.closest('.btn-icon')) return;
                const isHidden = projectsDiv.style.display === 'none';
                projectsDiv.style.display = isHidden ? 'block' : 'none';
                const icon = headerDiv.querySelector('i');
                icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            });

            categoryDiv.appendChild(headerDiv);
            categoryDiv.appendChild(projectsDiv);
            elements.archiveProjects.appendChild(categoryDiv);
        });
    },

    // 取消归档
    unarchiveProject(projectId) {
        const project = appState.projects.find(p => p.id === projectId);
        if (!project) return;

        if (confirm(`确定要将项目"${project.name}"恢复到活跃状态吗？`)) {
            project.isArchived = false;
            project.archiveCategory = '';
            project.archivedAt = null;
            project.updatedAt = new Date();

            projectManager.updateProjectList();
            this.updateArchiveDisplay();
            projectManager.saveToStorage();
            alert('项目已恢复到活跃状态');
        }
    },

    // 删除归档项目
    deleteArchivedProject(projectId) {
        if (confirm('确定要删除这个项目吗？')) {
            appState.projects = appState.projects.filter(p => p.id !== projectId);
            
            // 如果删除的是当前项目，清除当前项目
            if (appState.currentProject && appState.currentProject.id === projectId) {
                projectManager.setCurrentProject(null);
                canvasRenderer.clear();
            }
            
            projectManager.updateProjectList();
            this.updateArchiveDisplay();
            projectManager.saveToStorage();
        }
    },

    // 显示归档分类管理模态框
    showCategoryManagement() {
        elements.archiveCategoryModal.style.display = 'flex';
        this.renderCategoryList();
    },

    // 渲染分类列表
    renderCategoryList() {
        if (!elements.archiveCategoryList) return;
        
        elements.archiveCategoryList.innerHTML = '';
        
        appState.archiveCategories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'archive-category-item';
            item.innerHTML = `
                <div class="archive-category-item-name">${category}</div>
                <div class="archive-category-item-actions">
                    <button class="btn-icon" onclick="archiveManager.editCategory('${category}')" title="编辑分类">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="archiveManager.deleteCategory('${category}')" title="删除分类">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            elements.archiveCategoryList.appendChild(item);
        });
    },

    // 添加新分类
    addCategory() {
        const name = elements.newArchiveCategoryName.value.trim();
        if (!name) {
            alert('请输入分类名称');
            return;
        }

        if (appState.archiveCategories.includes(name)) {
            alert('分类已存在');
            return;
        }

        appState.archiveCategories.push(name);
        elements.newArchiveCategoryName.value = '';
        this.renderCategoryList();
        projectManager.saveToStorage();
        alert('分类添加成功');
    },

    // 编辑分类
    editCategory(oldName) {
        const newName = prompt('请输入新的分类名称：', oldName);
        if (!newName || newName.trim() === '' || newName.trim() === oldName) {
            return;
        }

        const trimmedName = newName.trim();
        if (appState.archiveCategories.includes(trimmedName)) {
            alert('分类已存在');
            return;
        }

        // 更新分类名称
        const index = appState.archiveCategories.indexOf(oldName);
        if (index !== -1) {
            appState.archiveCategories[index] = trimmedName;
        }

        // 更新已归档项目的分类
        appState.projects.forEach(project => {
            if (project.archiveCategory === oldName) {
                project.archiveCategory = trimmedName;
            }
        });

        this.renderCategoryList();
        projectManager.updateArchiveDisplay();
        projectManager.saveToStorage();
        alert('分类修改成功');
    },

    // 删除分类
    deleteCategory(categoryName) {
        // 检查是否有项目使用此分类
        const projectsInCategory = appState.projects.filter(p => p.archiveCategory === categoryName);
        
        if (projectsInCategory.length > 0) {
            if (!confirm(`分类"${categoryName}"中有${projectsInCategory.length}个项目，删除分类后这些项目将移动到"未分类"。确定要删除吗？`)) {
                return;
            }
            
            // 将项目移动到未分类
            projectsInCategory.forEach(project => {
                project.archiveCategory = '未分类';
            });
        }

        // 删除分类
        const index = appState.archiveCategories.indexOf(categoryName);
        if (index !== -1) {
            appState.archiveCategories.splice(index, 1);
        }

        this.renderCategoryList();
        projectManager.updateArchiveDisplay();
        projectManager.saveToStorage();
        alert('分类删除成功');
    },

    // 删除分类下的所有项目
    deleteCategoryProjects(categoryName) {
        const projectsInCategory = appState.projects.filter(p => p.archiveCategory === categoryName);
        
        if (projectsInCategory.length === 0) return;

        if (confirm(`确定要删除"${categoryName}"分类下的所有${projectsInCategory.length}个项目吗？此操作不可撤销。`)) {
            projectsInCategory.forEach(project => {
                appState.projects = appState.projects.filter(p => p.id !== project.id);
            });

            projectManager.updateArchiveDisplay();
            projectManager.saveToStorage();
            alert(`已删除${projectsInCategory.length}个项目`);
        }
    }
};

// 连接管理器
const connectionManager = {
    // 创建连接
    createConnection(fromNode, toNode) {
        if (!appState.currentProject || fromNode === toNode) return null;
        
        // 检查是否已存在连接
        const existingConnection = appState.currentProject.connections.find(
            c => (c.fromId === fromNode.id && c.toId === toNode.id) ||
                 (c.fromId === toNode.id && c.toId === fromNode.id)
        );
        
        if (existingConnection) {
            console.log('连接已存在');
            return null;
        }

        const connection = new Connection(fromNode.id, toNode.id);
        appState.currentProject.addConnection(connection);
        canvasRenderer.renderConnections();
        projectManager.saveToStorage();
        console.log('创建连接成功:', fromNode.title, '->', toNode.title);
        return connection;
    },

    // 开始临时连接
    startTempConnection(fromNode, event) {
        const rect = elements.canvas.getBoundingClientRect();
        const startX = fromNode.x;
        const startY = fromNode.y;
        
        // 创建临时连接线
        const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tempLine.setAttribute('x1', startX);
        tempLine.setAttribute('y1', startY);
        tempLine.setAttribute('x2', startX);
        tempLine.setAttribute('y2', startY);
        tempLine.setAttribute('stroke', '#e74c3c');
        tempLine.setAttribute('stroke-width', '3');
        tempLine.setAttribute('stroke-dasharray', '8,4');
        tempLine.classList.add('temp-connection');
        
        elements.connectionsLayer.appendChild(tempLine);
        appState.tempConnection = tempLine;
    },

    // 更新临时连接线
    updateTempConnection(event) {
        if (!appState.tempConnection || !appState.connectionStart) return;
        
        const rect = elements.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        appState.tempConnection.setAttribute('x2', mouseX);
        appState.tempConnection.setAttribute('y2', mouseY);
    },

    // 结束临时连接
    endTempConnection(event) {
        // 移除事件监听
        document.removeEventListener('mousemove', connectionManager.updateTempConnection);
        document.removeEventListener('mouseup', connectionManager.endTempConnection);
        
        // 移除临时连接线
        if (appState.tempConnection) {
            appState.tempConnection.remove();
            appState.tempConnection = null;
        }
        
        // 检查是否释放在节点上
        const targetElement = document.elementFromPoint(event.clientX, event.clientY);
        const targetNode = connectionManager.findNodeFromElement(targetElement);
        
        if (targetNode && targetNode !== appState.connectionStart) {
            connectionManager.createConnection(appState.connectionStart, targetNode);
        }
        
        // 重置状态
        appState.isConnecting = false;
        appState.connectionStart = null;
    },

    // 根据元素查找节点
    findNodeFromElement(element) {
        if (!element || !appState.currentProject) return null;
        
        let nodeElement = element;
        while (nodeElement && !nodeElement.classList.contains('node')) {
            nodeElement = nodeElement.parentElement;
        }
        
        if (!nodeElement) return null;
        
        const nodeId = nodeElement.getAttribute('data-node-id');
        return appState.currentProject.findNode(nodeId);
    },

    // 退出连接模式
    exitConnectionMode() {
        appState.isConnecting = false;
        appState.connectionStart = null;
        
        if (appState.tempConnection) {
            appState.tempConnection.remove();
            appState.tempConnection = null;
        }
        
        console.log('退出连接模式');
    }
};

// 侧边栏管理器
const sidebarManager = {
    isResizing: false,
    startX: 0,
    startWidth: 0,
    minWidth: 300,
    maxWidth: window.innerWidth * 0.6,

    // 初始化侧边栏
    init() {
        this.setupResizeHandle();
        this.setupCloseButton();
    },

    // 设置拖拽调节手柄
    setupResizeHandle() {
        if (!elements.resizeHandle) return;

        elements.resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            this.startX = e.clientX;
            this.startWidth = elements.resourceSidebar.offsetWidth;
            
            elements.resizeHandle.classList.add('dragging');
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', this.handleResize.bind(this));
            document.addEventListener('mouseup', this.stopResize.bind(this));
        });
    },

    // 处理拖拽调节
    handleResize(e) {
        if (!this.isResizing) return;

        const deltaX = this.startX - e.clientX;
        const newWidth = this.startWidth + deltaX;
        
        if (newWidth >= this.minWidth && newWidth <= this.maxWidth) {
            elements.resourceSidebar.style.width = newWidth + 'px';
        }
    },

    // 停止拖拽调节
    stopResize() {
        this.isResizing = false;
        elements.resizeHandle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        document.removeEventListener('mousemove', this.handleResize.bind(this));
        document.removeEventListener('mouseup', this.stopResize.bind(this));
    },

    // 设置关闭按钮
    setupCloseButton() {
        if (elements.closeSidebar) {
            elements.closeSidebar.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
    },

    // 显示侧边栏
    showSidebar() {
        elements.resourceSidebar.classList.add('active');
    },

    // 隐藏侧边栏
    closeSidebar() {
        elements.resourceSidebar.classList.remove('active');
    }
};

// 资源管理器
const resourceManager = {
    currentNode: null,
    currentCategory: 'all',

    // 初始化节点侧边栏
    selectNode(node) {
        this.currentNode = node;
        appState.selectedNode = node;
        
        // 如果是第一次打开节点且没有自定义分类，显示空白状态
        const customCategories = this.getCustomCategories();
        if (customCategories.length === 0 && (!node.resources || node.resources.length === 0)) {
            this.showEmptyState();
        } else {
            this.updateResourcePanel();
            this.updateCategoryNavigation();
            this.setupCategoryEvents();
        }
        
        sidebarManager.showSidebar();
    },

    // 显示空白状态
    showEmptyState() {
        const createdTime = this.formatDateTime(this.currentNode.createdAt);
        elements.selectedNodeInfo.innerHTML = `
            <div class="selected-node-title">${this.currentNode.title}</div>
            <div class="selected-node-meta">
                <div>资源数量: 0</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
                    <i class="fas fa-clock"></i> 创建时间: ${createdTime}
                </div>
            </div>
        `;
        
        // 只显示全部资源分类
        const categoryContainer = document.getElementById('resourceCategories');
        categoryContainer.innerHTML = `
            <div class="category-item active" data-category="all">
                <i class="fas fa-folder"></i> 全部资源
            </div>
        `;
        
        // 显示空资源列表
        elements.resourceList.innerHTML = `
            <div class="empty-resources">
                <i class="fas fa-bookmark"></i>
                <p>暂无资源</p>
                <p style="font-size: 0.8rem; color: #999; margin-top: 8px;">点击"管理分类"添加自定义分类</p>
            </div>
        `;
        
        this.setupCategoryEvents();
    },

    // 设置分类事件
    setupCategoryEvents() {
        if (elements.resourceCategories) {
            const categoryItems = elements.resourceCategories.querySelectorAll('.category-item');
            categoryItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    // 移除所有active类
                    categoryItems.forEach(cat => cat.classList.remove('active'));
                    // 添加active类到当前项
                    item.classList.add('active');
                    // 更新当前分类
                    this.currentCategory = item.dataset.category;
                    // 重新渲染资源列表
                    this.renderResourceList();
                });
            });
        }
    },

    // 更新资源面板
    updateResourcePanel() {
        if (!this.currentNode) {
            elements.selectedNodeInfo.innerHTML = '<p>请选择一个节点查看资源</p>';
            return;
        }

        const createdTime = this.formatDateTime(this.currentNode.createdAt);
        elements.selectedNodeInfo.innerHTML = `
            <div class="selected-node-title">${this.currentNode.title}</div>
            <div class="selected-node-meta">
                <div>资源数量: ${this.currentNode.resources.length}</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
                    <i class="fas fa-clock"></i> 创建时间: ${createdTime}
                </div>
            </div>
        `;
        this.renderResourceList();
    },

    // 格式化日期时间
    formatDateTime(date) {
        if (!date) return '未知';
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // 渲染资源列表
    renderResourceList() {
        if (!this.currentNode || !elements.resourceList) return;

        let resources = this.currentNode.resources;
        
        if (this.currentCategory !== 'all') {
            const customCategories = this.getCustomCategories();
            const currentCategoryObj = customCategories.find(cat => cat.key === this.currentCategory);
            
            if (currentCategoryObj) {
                // 只显示明确分配给该分类的资源
                resources = resources.filter(resource => resource.category === this.currentCategory);
            }
        }

        if (resources.length === 0) {
            elements.resourceList.innerHTML = `
                <div class="empty-resources">
                    <i class="fas fa-bookmark"></i>
                    <p>暂无资源</p>
                </div>
            `;
            return;
        }

        const resourcesHtml = resources.map(resource => `
            <div class="resource-item">
                <div class="resource-info">
                    <div class="resource-title">${resource.title}</div>
                    <div class="resource-type">${this.getResourceTypeText(resource.type)}</div>
                </div>
                <div class="resource-actions-small">
                    <button class="resource-btn view" onclick="resourceManager.viewResource('${resource.id}')">查看</button>
                    <button class="resource-btn edit" onclick="resourceManager.editResource('${resource.id}')">编辑</button>
                    <button class="resource-btn copy" onclick="resourceManager.copyResource('${resource.id}')">复制</button>
                    <button class="resource-btn delete" onclick="resourceManager.deleteResource('${resource.id}')">删除</button>
                </div>
            </div>
        `).join('');

        elements.resourceList.innerHTML = resourcesHtml;
    },

    // 获取资源类型文本
    getResourceTypeText(type) {
        const typeMap = {
            'link': '链接',
            'note': '笔记',
            'image': '图片',
            'document': '文档',
            'code': '代码片段'
        };
        return typeMap[type] || type;
    },

    // 编辑资源
    editResource(resourceId) {
        const resource = this.currentNode.findResource(resourceId);
        if (resource) {
            // 填充编辑表单
            elements.resourceType.value = resource.type;
            elements.resourceTitle.value = resource.title;
            if (resource.url) elements.resourceUrl.value = resource.url;
            if (resource.content) elements.resourceContent.value = resource.content;
            
            // 如果是图片或文档类型，填充文件路径
            if ((resource.type === 'image' || resource.type === 'document') && resource.filePath) {
                const filePathInput = document.getElementById('resourceFile');
                if (filePathInput) {
                    filePathInput.value = resource.filePath;
                    // 显示文件预览信息
                    const filePreview = document.getElementById('filePreview');
                    const fileName = document.getElementById('fileName');
                    if (filePreview && fileName) {
                        filePreview.style.display = 'block';
                        fileName.textContent = `已保存文件: ${resource.filePath.split('/').pop()}`;
                    }
                }
            }
            
            // 显示模态框
            elements.resourceModal.style.display = 'block';
            this.editingResourceId = resourceId;
            this.updateResourceForm();
        }
    },

    // 复制资源内容到剪贴板
    copyResource(resourceId) {
        const resource = this.currentNode.findResource(resourceId);
        if (!resource) {
            alert('未找到资源');
            return;
        }

        console.log('复制资源:', resource); // 调试信息
        
        let copyText = '';
        if (resource.type === 'link') {
            // 链接类型只复制URL
            copyText = resource.url || '';
        } else if (resource.type === 'image' || resource.type === 'document') {
            // 图片和文档类型优先复制内容，如果没有内容则提示进入编辑框复制文件路径
            if (resource.content && resource.content.trim()) {
                copyText = resource.content;
            } else {
                alert('该资源没有文本内容，请进入编辑模式复制文件路径');
                return;
            }
        } else {
            // 其他类型（笔记、代码片段等）复制内容
            copyText = resource.content || '';
        }

        if (!copyText) {
            alert('资源内容为空，无法复制');
            return;
        }
        
        navigator.clipboard.writeText(copyText).then(() => {
            alert('内容已复制到剪贴板');
        }).catch(() => {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = copyText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('内容已复制到剪贴板');
        });
    },

    // 显示添加资源模态框
    showAddResourceModal() {
        if (!this.currentNode) {
            alert('请先选择一个节点');
            return;
        }
        
        elements.resourceType.value = 'link';
        this.clearAllFormContent();
        this.editingResourceId = null;
        
        this.updateResourceForm();
        elements.resourceModal.style.display = 'flex';
        elements.resourceTitle.focus();
    },

    // 更新资源表单显示
    updateResourceForm() {
        const type = elements.resourceType.value;
        
        if (type === 'link') {
            elements.resourceUrlGroup.style.display = 'block';
            elements.resourceContentGroup.style.display = 'none';
            document.getElementById('resourceFileGroup').style.display = 'none';
        } else if (type === 'image' || type === 'document') {
            elements.resourceUrlGroup.style.display = 'none';
            elements.resourceContentGroup.style.display = 'block';
            document.getElementById('resourceFileGroup').style.display = 'block';
        } else if (type === 'code') {
            elements.resourceUrlGroup.style.display = 'none';
            elements.resourceContentGroup.style.display = 'block';
            document.getElementById('resourceFileGroup').style.display = 'none';
            // 为代码片段设置特殊的占位符和样式
            const contentTextarea = elements.resourceContent;
            contentTextarea.placeholder = '请粘贴代码片段（支持Markdown格式）\n\n```javascript\nfunction example() {\n    console.log("Hello World");\n}\n```';
            contentTextarea.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace';
            contentTextarea.style.fontSize = '0.9rem';
        } else {
            elements.resourceUrlGroup.style.display = 'none';
            elements.resourceContentGroup.style.display = 'block';
            document.getElementById('resourceFileGroup').style.display = 'none';
            // 重置普通文本样式
            const contentTextarea = elements.resourceContent;
            contentTextarea.placeholder = '请输入内容';
            contentTextarea.style.fontFamily = 'inherit';
            contentTextarea.style.fontSize = '0.9rem';
        }
    },

    // 添加资源
    addResource() {
        if (!this.currentNode) return;

        const type = elements.resourceType.value;
        const title = elements.resourceTitle.value.trim();
        
        if (!title) {
            alert('请输入资源标题');
            return;
        }

        let url = '';
        let content = '';
        let filePath = '';
        
        if (type === 'link') {
            url = elements.resourceUrl.value.trim();
            if (!url) {
                alert('请输入链接地址');
                return;
            }
        } else {
            content = elements.resourceContent.value.trim();
            if (!content) {
                alert('请输入资源内容');
                return;
            }
            
            // 如果是图片或文档类型，也保存文件路径
            if (type === 'image' || type === 'document') {
                const fileInput = document.getElementById('resourceFile');
                if (fileInput) {
                    filePath = fileInput.value.trim();
                }
            }
        }

        if (this.editingResourceId) {
            // 编辑现有资源
            const resource = this.currentNode.findResource(this.editingResourceId);
            if (resource) {
                resource.title = title;
                resource.type = type;
                resource.url = url;
                resource.content = content;
                resource.filePath = filePath;
            }
            this.editingResourceId = null;
        } else {
            // 添加新资源
            const resource = new Resource(type, title, url, content);
            resource.filePath = filePath;
            
            // 如果当前选中的是自定义分类，将资源分配给该分类
            if (this.currentCategory !== 'all') {
                resource.category = this.currentCategory;
            }
            
            this.currentNode.addResource(resource);
        }
        
        // 关闭模态框
        elements.resourceModal.style.display = 'none';
        
        // 只清空文件上传相关内容，不清空文本内容
        this.clearFileUpload();
        
        // 更新显示
        this.updateResourcePanel();
        projectManager.saveToStorage();
    },

    // 文件上传处理
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // 创建文件URL用于预览和存储
            const fileURL = URL.createObjectURL(file);
            
            // 显示文件预览
            document.getElementById('filePreview').style.display = 'block';
            document.getElementById('fileName').textContent = `已选择: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            
            // 将文件信息存储到隐藏字段
            document.getElementById('resourceFile').value = fileURL;
            document.getElementById('resourceFile').dataset.fileName = file.name;
            document.getElementById('resourceFile').dataset.fileType = file.type;
        }
    },

    removeFile() {
        document.getElementById('resourceFileInput').value = '';
        document.getElementById('resourceFile').value = '';
        document.getElementById('filePreview').style.display = 'none';
        delete document.getElementById('resourceFile').dataset.fileName;
        delete document.getElementById('resourceFile').dataset.fileType;
    },

    // 清空文件上传表单
    clearFileUpload() {
        const fileInput = document.getElementById('resourceFileInput');
        const filePathInput = document.getElementById('resourceFile');
        const filePreview = document.getElementById('filePreview');
        
        if (fileInput) fileInput.value = '';
        if (filePathInput) {
            filePathInput.value = '';
            delete filePathInput.dataset.fileName;
            delete filePathInput.dataset.fileType;
        }
        if (filePreview) filePreview.style.display = 'none';
    },

    // 清空所有表单内容（仅在显示新增资源模态框时使用）
    clearAllFormContent() {
        // 清空文件上传
        this.clearFileUpload();
        
        // 清空所有表单字段
        if (elements.resourceContent) {
            elements.resourceContent.value = '';
            elements.resourceContent.style.fontFamily = 'inherit';
            elements.resourceContent.style.fontSize = '0.9rem';
            elements.resourceContent.placeholder = '请输入内容';
        }
        if (elements.resourceTitle) elements.resourceTitle.value = '';
        if (elements.resourceUrl) elements.resourceUrl.value = '';
    },

    // 分类管理功能
    showCategoryManagement() {
        document.getElementById('categoryModal').style.display = 'block';
        this.renderCategoryList();
    },

    renderCategoryList() {
        const categoryList = document.getElementById('categoryList');
        const categories = this.getCustomCategories();
        const defaultCategories = this.getDefaultCategories();
        
        // 渲染默认分类（只有全部资源，不可编辑删除）
        const defaultHtml = defaultCategories.map(cat => `
            <div class="category-item-manage">
                <div class="category-info">
                    <i class="${cat.icon}"></i>
                    <span>${cat.name}</span>
                    <small style="color: #666; margin-left: 8px;">(系统)</small>
                </div>
                <div class="category-actions">
                    <span style="color: #999; font-size: 0.8rem;">系统分类</span>
                </div>
            </div>
        `).join('');
        
        // 渲染自定义分类
        const customHtml = categories.map(cat => `
            <div class="category-item-manage">
                <div class="category-info">
                    <i class="${cat.icon}"></i>
                    <span>${cat.name}</span>
                </div>
                <div class="category-actions">
                    <button class="btn btn-warning" onclick="resourceManager.editCategory('${cat.id}')">编辑</button>
                    <button class="btn btn-danger" onclick="resourceManager.deleteCategory('${cat.id}')">删除</button>
                </div>
            </div>
        `).join('');
        
        categoryList.innerHTML = defaultHtml + customHtml;
    },

    getDefaultCategories() {
        // 只返回全部资源分类
        return [
            { key: 'all', name: '全部资源', icon: 'fas fa-folder' }
        ];
    },

    saveDefaultCategories(categories) {
        localStorage.setItem('defaultCategories', JSON.stringify(categories));
    },

    editDefaultCategory(categoryKey) {
        const categories = this.getDefaultCategories();
        const category = categories.find(c => c.key === categoryKey);
        if (category) {
            const newName = prompt('请输入新的分类名称:', category.name);
            if (newName && newName.trim()) {
                category.name = newName.trim();
                this.saveDefaultCategories(categories);
                this.renderCategoryList();
                this.updateCategoryNavigation();
            }
        }
    },

    deleteDefaultCategory(categoryKey) {
        if (categoryKey === 'all') {
            alert('全部资源分类不能删除');
            return;
        }
        
        if (confirm('确定要删除这个默认分类吗？')) {
            const categories = this.getDefaultCategories();
            const filtered = categories.filter(c => c.key !== categoryKey);
            this.saveDefaultCategories(filtered);
            this.renderCategoryList();
            this.updateCategoryNavigation();
        }
    },

    getCustomCategories() {
        const saved = localStorage.getItem('customCategories');
        return saved ? JSON.parse(saved) : [];
    },

    saveCustomCategories(categories) {
        localStorage.setItem('customCategories', JSON.stringify(categories));
    },

    addCategory() {
        const name = document.getElementById('newCategoryName').value.trim();
        const icon = document.getElementById('newCategoryIcon').value;
        
        if (!name) {
            alert('请输入分类名称');
            return;
        }
        
        const categories = this.getCustomCategories();
        const newCategory = {
            id: Date.now().toString(),
            name: name,
            icon: icon,
            key: name.toLowerCase().replace(/\s+/g, '_')
        };
        
        categories.push(newCategory);
        this.saveCustomCategories(categories);
        this.renderCategoryList();
        this.updateCategoryNavigation();
        
        // 清空输入
        document.getElementById('newCategoryName').value = '';
    },

    editCategory(categoryId) {
        const categories = this.getCustomCategories();
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            const newName = prompt('请输入新的分类名称:', category.name);
            if (newName && newName.trim()) {
                category.name = newName.trim();
                category.key = newName.toLowerCase().replace(/\s+/g, '_');
                this.saveCustomCategories(categories);
                this.renderCategoryList();
                this.updateCategoryNavigation();
            }
        }
    },

    deleteCategory(categoryId) {
        if (confirm('确定要删除这个分类吗？')) {
            const categories = this.getCustomCategories();
            const filtered = categories.filter(c => c.id !== categoryId);
            this.saveCustomCategories(filtered);
            this.renderCategoryList();
            this.updateCategoryNavigation();
        }
    },

    updateCategoryNavigation() {
        const customCategories = this.getCustomCategories();
        const defaultCategories = this.getDefaultCategories();
        const categoryContainer = document.getElementById('resourceCategories');
        
        // 渲染默认分类（使用保存的名称）
        const defaultHtml = defaultCategories.map((cat, index) => `
            <div class="category-item ${index === 0 ? 'active' : ''}" data-category="${cat.key}">
                <i class="${cat.icon}"></i> ${cat.name}
            </div>
        `).join('');
        
        // 添加自定义分类
        const customHtml = customCategories.map(cat => `
            <div class="category-item" data-category="${cat.key}">
                <i class="${cat.icon}"></i> ${cat.name}
            </div>
        `).join('');
        
        categoryContainer.innerHTML = defaultHtml + customHtml;
        this.setupCategoryEvents();
    },

    // 查看资源
    viewResource(resourceId) {
        if (!this.currentNode) return;

        const resource = this.currentNode.findResource(resourceId);
        if (!resource) {
            alert('未找到资源');
            return;
        }

        console.log('查看资源:', resource); // 调试信息

        if (resource.type === 'link') {
            if (resource.url) {
                window.open(resource.url, '_blank');
            } else {
                alert('链接地址为空');
            }
        } else if (resource.type === 'image' || resource.type === 'document') {
            // 如果有文件URL，在新窗口打开
            const filePath = resource.filePath || resource.content;
            
            if (filePath && (filePath.startsWith('blob:') || filePath.startsWith('http'))) {
                if (resource.type === 'document') {
                    // 对于文档类型，创建一个新的窗口并设置正确的编码
                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                        newWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <title>${resource.title}</title>
                                <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    .document-header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
                                    .document-content { white-space: pre-wrap; }
                                </style>
                            </head>
                            <body>
                                <div class="document-header">
                                    <h2>${resource.title}</h2>
                                    <p>文件路径: ${filePath}</p>
                                </div>
                                <div class="document-content">
                                    <iframe src="${filePath}" width="100%" height="600px" style="border: none;"></iframe>
                                </div>
                            </body>
                            </html>
                        `);
                        newWindow.document.close();
                    }
                } else {
                    // 图片直接在新窗口打开
                    window.open(filePath, '_blank');
                }
            } else if (resource.content && resource.content.trim()) {
                // 如果有文本内容，显示在模态框中
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); z-index: 10000; display: flex;
                    align-items: center; justify-content: center;
                `;
                modal.innerHTML = `
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0;">${resource.title}</h3>
                            <button onclick="this.closest('.modal').remove()" style="border: none; background: #f0f0f0; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
                        </div>
                        <div style="white-space: pre-wrap; font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 4px;">
                            ${resource.content}
                        </div>
                    </div>
                `;
                modal.className = 'modal';
                document.body.appendChild(modal);
            } else {
                alert(`文件路径: ${filePath || '文件路径为空'}`);
            }
        } else if (resource.type === 'code') {
            // 代码片段用模态框显示
            const codeContent = resource.content || '代码内容为空';
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); z-index: 10000; display: flex;
                align-items: center; justify-content: center;
            `;
            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0;">${resource.title}</h3>
                        <button onclick="this.closest('.modal').remove()" style="border: none; background: #f0f0f0; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
                    </div>
                    <pre class="code-resource">${codeContent}</pre>
                </div>
            `;
            modal.className = 'modal';
            document.body.appendChild(modal);
        } else {
            // 其他类型（笔记等）
            const content = resource.content || '内容为空';
            alert(`资源内容: ${content}`);
        }
    },

    // 删除资源
    deleteResource(resourceId) {
        if (!this.currentNode) return;

        const resource = this.currentNode.findResource(resourceId);
        if (!resource) return;

        if (confirm(`确定要删除资源"${resource.title}"吗？`)) {
            this.currentNode.removeResource(resourceId);
            this.updateResourcePanel();
            projectManager.saveToStorage();
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    sidebarManager.init();
    projectManager.loadFromStorage();
    console.log('学习轨迹图应用已初始化');
});
